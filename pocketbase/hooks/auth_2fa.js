// pocketbase/hooks/auth_2fa.js
// Implementa suporte a 2FA / TOTP (RFC 6238)
// ATENÇÃO: Conforme as regras do Goja/PocketBase hooks, funções e declarações
// devem ficar dentro dos corpos dos callbacks.

// 1. Setup 2FA: Gera novo secret Base32 para o usuário (ou retorna o existente pendente)
routerAdd(
  'POST',
  '/backend/v1/auth/2fa/setup',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Autenticação necessária')

    const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const genSecret = (len) => {
      let r = ''
      for (let i = 0; i < len; i++) {
        r += BASE32[Math.floor(Math.random() * BASE32.length)]
      }
      return r
    }

    let secret = user.getString('two_factor_secret')
    if (!secret || secret.length < 16) {
      secret = genSecret(20)
      user.set('two_factor_secret', secret)
      $app.save(user)
    }

    const email = user.getString('email') || user.getString('name') || 'admin'
    const issuer = 'SGFM - Grupo Flavio Moura'
    const otpauthUri =
      'otpauth://totp/' +
      encodeURIComponent(issuer) +
      ':' +
      encodeURIComponent(email) +
      '?secret=' +
      secret +
      '&issuer=' +
      encodeURIComponent(issuer) +
      '&algorithm=SHA1&digits=6&period=30'

    return e.json(200, {
      secret: secret,
      otpauth_uri: otpauthUri,
      enabled: user.getBool('two_factor_enabled'),
      email: email,
      issuer: issuer,
    })
  },
  $apis.requireAuth(),
)

// 2. Enable 2FA: Valida o código TOTP digitado e ativa
routerAdd(
  'POST',
  '/backend/v1/auth/2fa/enable',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Autenticação necessária')

    const body = e.requestInfo().body || {}
    const code = body.code
    const secret = body.secret || user.getString('two_factor_secret')

    if (!code) return e.badRequestError('Código TOTP obrigatório')
    if (!secret) return e.badRequestError('Segredo 2FA não configurado')

    // --- Helper inline TOTP ---
    const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    function base32Decode(input) {
      const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
      let bits = 0
      let value = 0
      const output = []
      for (let i = 0; i < clean.length; i++) {
        const val = BASE32.indexOf(clean.charAt(i))
        if (val === -1) continue
        value = (value << 5) | val
        bits += 5
        if (bits >= 8) {
          output.push((value >>> (bits - 8)) & 255)
          bits -= 8
        }
      }
      return output
    }

    function sha1(bytes) {
      const words = []
      for (let i = 0; i < bytes.length; i++) {
        const wordIndex = i >> 2
        if (!words[wordIndex]) words[wordIndex] = 0
        words[wordIndex] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8)
      }
      const bitLength = bytes.length * 8
      const padWordIndex = bitLength >> 5
      if (!words[padWordIndex]) words[padWordIndex] = 0
      words[padWordIndex] |= 0x80 << (24 - (bitLength % 32))
      const totalWords = (((bitLength + 64) >>> 9) << 4) + 16
      while (words.length < totalWords) words.push(0)
      words[totalWords - 1] = bitLength

      let h0 = 0x67452301,
        h1 = 0xefcdab89,
        h2 = 0x98badcfe,
        h3 = 0x10325476,
        h4 = 0xc3d2e1f0
      const w = new Array(80)

      for (let i = 0; i < words.length; i += 16) {
        for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0
        for (let j = 16; j < 80; j++) {
          const x = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]
          w[j] = (x << 1) | (x >>> 31)
        }
        let a = h0,
          b = h1,
          c = h2,
          d = h3,
          e = h4
        for (let j = 0; j < 80; j++) {
          let f, k
          if (j < 20) {
            f = (b & c) | (~b & d)
            k = 0x5a827999
          } else if (j < 40) {
            f = b ^ c ^ d
            k = 0x6ed9eba1
          } else if (j < 60) {
            f = (b & c) | (b & d) | (c & d)
            k = 0x8f1bbcdc
          } else {
            f = b ^ c ^ d
            k = 0xca62c1d6
          }
          const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0
          e = d
          d = c
          c = (b << 30) | (b >>> 2)
          b = a
          a = temp
        }
        h0 = (h0 + a) | 0
        h1 = (h1 + b) | 0
        h2 = (h2 + c) | 0
        h3 = (h3 + d) | 0
        h4 = (h4 + e) | 0
      }

      const out = []
      const hash = [h0, h1, h2, h3, h4]
      for (let i = 0; i < 5; i++) {
        for (let j = 3; j >= 0; j--) {
          out.push((hash[i] >>> (j * 8)) & 0xff)
        }
      }
      return out
    }

    function hmacSha1(keyBytes, msgBytes) {
      let k = keyBytes.slice()
      if (k.length > 64) k = sha1(k)
      while (k.length < 64) k.push(0)
      const oPad = new Array(64)
      const iPad = new Array(64)
      for (let i = 0; i < 64; i++) {
        oPad[i] = k[i] ^ 0x5c
        iPad[i] = k[i] ^ 0x36
      }
      return sha1(oPad.concat(sha1(iPad.concat(msgBytes))))
    }

    function generateTOTP(sec, offset) {
      const step = Math.floor(Math.floor(Date.now() / 1000) / 30) + (offset || 0)
      const timeBytes = [0, 0, 0, 0, 0, 0, 0, 0]
      let temp = step
      for (let i = 7; i >= 0; i--) {
        timeBytes[i] = temp & 0xff
        temp = Math.floor(temp / 256)
      }
      const keyBytes = base32Decode(sec)
      const hmac = hmacSha1(keyBytes, timeBytes)
      const hOffset = hmac[hmac.length - 1] & 0x0f
      const binary =
        ((hmac[hOffset] & 0x7f) << 24) |
        ((hmac[hOffset + 1] & 0xff) << 16) |
        ((hmac[hOffset + 2] & 0xff) << 8) |
        (hmac[hOffset + 3] & 0xff)
      let otp = (binary % 1000000).toString()
      while (otp.length < 6) otp = '0' + otp
      return otp
    }

    const clean = code.toString().trim()
    let valid = false
    for (let off = -1; off <= 1; off++) {
      if (generateTOTP(secret, off) === clean) {
        valid = true
        break
      }
    }

    if (!valid) {
      return e.badRequestError('Código de verificação inválido ou expirado')
    }

    user.set('two_factor_secret', secret)
    user.set('two_factor_enabled', true)
    $app.save(user)

    return e.json(200, {
      success: true,
      message: 'Autenticação em duas etapas ativada com sucesso.',
      enabled: true,
    })
  },
  $apis.requireAuth(),
)

// 3. Disable 2FA: Desativa com validação de código ou confirmação
routerAdd(
  'POST',
  '/backend/v1/auth/2fa/disable',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Autenticação necessária')

    const body = e.requestInfo().body || {}
    const code = body.code
    const secret = user.getString('two_factor_secret')

    if (code && secret) {
      const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      function base32Decode(input) {
        const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
        let bits = 0
        let value = 0
        const output = []
        for (let i = 0; i < clean.length; i++) {
          const val = BASE32.indexOf(clean.charAt(i))
          if (val === -1) continue
          value = (value << 5) | val
          bits += 5
          if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255)
            bits -= 8
          }
        }
        return output
      }

      function sha1(bytes) {
        const words = []
        for (let i = 0; i < bytes.length; i++) {
          const wordIndex = i >> 2
          if (!words[wordIndex]) words[wordIndex] = 0
          words[wordIndex] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8)
        }
        const bitLength = bytes.length * 8
        const padWordIndex = bitLength >> 5
        if (!words[padWordIndex]) words[padWordIndex] = 0
        words[padWordIndex] |= 0x80 << (24 - (bitLength % 32))
        const totalWords = (((bitLength + 64) >>> 9) << 4) + 16
        while (words.length < totalWords) words.push(0)
        words[totalWords - 1] = bitLength

        let h0 = 0x67452301,
          h1 = 0xefcdab89,
          h2 = 0x98badcfe,
          h3 = 0x10325476,
          h4 = 0xc3d2e1f0
        const w = new Array(80)

        for (let i = 0; i < words.length; i += 16) {
          for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0
          for (let j = 16; j < 80; j++) {
            const x = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]
            w[j] = (x << 1) | (x >>> 31)
          }
          let a = h0,
            b = h1,
            c = h2,
            d = h3,
            e = h4
          for (let j = 0; j < 80; j++) {
            let f, k
            if (j < 20) {
              f = (b & c) | (~b & d)
              k = 0x5a827999
            } else if (j < 40) {
              f = b ^ c ^ d
              k = 0x6ed9eba1
            } else if (j < 60) {
              f = (b & c) | (b & d) | (c & d)
              k = 0x8f1bbcdc
            } else {
              f = b ^ c ^ d
              k = 0xca62c1d6
            }
            const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0
            e = d
            d = c
            c = (b << 30) | (b >>> 2)
            b = a
            a = temp
          }
          h0 = (h0 + a) | 0
          h1 = (h1 + b) | 0
          h2 = (h2 + c) | 0
          h3 = (h3 + d) | 0
          h4 = (h4 + e) | 0
        }

        const out = []
        const hash = [h0, h1, h2, h3, h4]
        for (let i = 0; i < 5; i++) {
          for (let j = 3; j >= 0; j--) {
            out.push((hash[i] >>> (j * 8)) & 0xff)
          }
        }
        return out
      }

      function hmacSha1(keyBytes, msgBytes) {
        let k = keyBytes.slice()
        if (k.length > 64) k = sha1(k)
        while (k.length < 64) k.push(0)
        const oPad = new Array(64)
        const iPad = new Array(64)
        for (let i = 0; i < 64; i++) {
          oPad[i] = k[i] ^ 0x5c
          iPad[i] = k[i] ^ 0x36
        }
        return sha1(oPad.concat(sha1(iPad.concat(msgBytes))))
      }

      function generateTOTP(sec, offset) {
        const step = Math.floor(Math.floor(Date.now() / 1000) / 30) + (offset || 0)
        const timeBytes = [0, 0, 0, 0, 0, 0, 0, 0]
        let temp = step
        for (let i = 7; i >= 0; i--) {
          timeBytes[i] = temp & 0xff
          temp = Math.floor(temp / 256)
        }
        const keyBytes = base32Decode(sec)
        const hmac = hmacSha1(keyBytes, timeBytes)
        const hOffset = hmac[hmac.length - 1] & 0x0f
        const binary =
          ((hmac[hOffset] & 0x7f) << 24) |
          ((hmac[hOffset + 1] & 0xff) << 16) |
          ((hmac[hOffset + 2] & 0xff) << 8) |
          (hmac[hOffset + 3] & 0xff)
        let otp = (binary % 1000000).toString()
        while (otp.length < 6) otp = '0' + otp
        return otp
      }

      const clean = code.toString().trim()
      let valid = false
      for (let off = -1; off <= 1; off++) {
        if (generateTOTP(secret, off) === clean) {
          valid = true
          break
        }
      }
      if (!valid) {
        return e.badRequestError('Código de confirmação inválido')
      }
    }

    user.set('two_factor_enabled', false)
    $app.save(user)

    return e.json(200, {
      success: true,
      message: 'Autenticação em duas etapas desativada com sucesso.',
      enabled: false,
    })
  },
  $apis.requireAuth(),
)

// 4. Verify Login: após senha correta de usuário com 2FA, valida o código TOTP de 6 dígitos
routerAdd('POST', '/backend/v1/auth/2fa/verify-login', (e) => {
  const body = e.requestInfo().body || {}
  const userId = body.user_id
  const code = body.code
  const tempToken = body.temp_token

  if (!userId || !code) {
    return e.badRequestError('user_id e code são obrigatórios')
  }

  let user
  try {
    user = $app.findRecordById('users', userId)
  } catch (_) {
    return e.badRequestError('Usuário não encontrado')
  }

  if (tempToken) {
    try {
      const payload = $security.parseJWT(tempToken, 'sgfm_2fa_temp_secret_key_2026')
      if (!payload || payload.user_id !== userId) {
        return e.badRequestError('Sessão temporária inválida')
      }
    } catch (err) {
      return e.badRequestError('Sessão temporária expirada')
    }
  }

  const secret = user.getString('two_factor_secret')
  const isEnabled = user.getBool('two_factor_enabled')

  if (!isEnabled || !secret) {
    const token = $app.createAuthToken(user)
    return e.json(200, {
      token: token,
      record: user,
    })
  }

  const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  function base32Decode(input) {
    const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
    let bits = 0
    let value = 0
    const output = []
    for (let i = 0; i < clean.length; i++) {
      const val = BASE32.indexOf(clean.charAt(i))
      if (val === -1) continue
      value = (value << 5) | val
      bits += 5
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }
    return output
  }

  function sha1(bytes) {
    const words = []
    for (let i = 0; i < bytes.length; i++) {
      const wordIndex = i >> 2
      if (!words[wordIndex]) words[wordIndex] = 0
      words[wordIndex] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8)
    }
    const bitLength = bytes.length * 8
    const padWordIndex = bitLength >> 5
    if (!words[padWordIndex]) words[padWordIndex] = 0
    words[padWordIndex] |= 0x80 << (24 - (bitLength % 32))
    const totalWords = (((bitLength + 64) >>> 9) << 4) + 16
    while (words.length < totalWords) words.push(0)
    words[totalWords - 1] = bitLength

    let h0 = 0x67452301,
      h1 = 0xefcdab89,
      h2 = 0x98badcfe,
      h3 = 0x10325476,
      h4 = 0xc3d2e1f0
    const w = new Array(80)

    for (let i = 0; i < words.length; i += 16) {
      for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0
      for (let j = 16; j < 80; j++) {
        const x = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]
        w[j] = (x << 1) | (x >>> 31)
      }
      let a = h0,
        b = h1,
        c = h2,
        d = h3,
        e = h4
      for (let j = 0; j < 80; j++) {
        let f, k
        if (j < 20) {
          f = (b & c) | (~b & d)
          k = 0x5a827999
        } else if (j < 40) {
          f = b ^ c ^ d
          k = 0x6ed9eba1
        } else if (j < 60) {
          f = (b & c) | (b & d) | (c & d)
          k = 0x8f1bbcdc
        } else {
          f = b ^ c ^ d
          k = 0xca62c1d6
        }
        const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0
        e = d
        d = c
        c = (b << 30) | (b >>> 2)
        b = a
        a = temp
      }
      h0 = (h0 + a) | 0
      h1 = (h1 + b) | 0
      h2 = (h2 + c) | 0
      h3 = (h3 + d) | 0
      h4 = (h4 + e) | 0
    }

    const out = []
    const hash = [h0, h1, h2, h3, h4]
    for (let i = 0; i < 5; i++) {
      for (let j = 3; j >= 0; j--) {
        out.push((hash[i] >>> (j * 8)) & 0xff)
      }
    }
    return out
  }

  function hmacSha1(keyBytes, msgBytes) {
    let k = keyBytes.slice()
    if (k.length > 64) k = sha1(k)
    while (k.length < 64) k.push(0)
    const oPad = new Array(64)
    const iPad = new Array(64)
    for (let i = 0; i < 64; i++) {
      oPad[i] = k[i] ^ 0x5c
      iPad[i] = k[i] ^ 0x36
    }
    return sha1(oPad.concat(sha1(iPad.concat(msgBytes))))
  }

  function generateTOTP(sec, offset) {
    const step = Math.floor(Math.floor(Date.now() / 1000) / 30) + (offset || 0)
    const timeBytes = [0, 0, 0, 0, 0, 0, 0, 0]
    let temp = step
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = temp & 0xff
      temp = Math.floor(temp / 256)
    }
    const keyBytes = base32Decode(sec)
    const hmac = hmacSha1(keyBytes, timeBytes)
    const hOffset = hmac[hmac.length - 1] & 0x0f
    const binary =
      ((hmac[hOffset] & 0x7f) << 24) |
      ((hmac[hOffset + 1] & 0xff) << 16) |
      ((hmac[hOffset + 2] & 0xff) << 8) |
      (hmac[hOffset + 3] & 0xff)
    let otp = (binary % 1000000).toString()
    while (otp.length < 6) otp = '0' + otp
    return otp
  }

  const clean = code.toString().trim()
  let valid = false
  for (let off = -1; off <= 1; off++) {
    if (generateTOTP(secret, off) === clean) {
      valid = true
      break
    }
  }

  if (!valid) {
    return e.badRequestError('Código de autenticação inválido ou expirado')
  }

  const token = $app.createAuthToken(user)
  return e.json(200, {
    token: token,
    record: user,
  })
})
