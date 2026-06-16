import { create } from 'zustand'
import pb from '@/lib/pocketbase/client'
import {
  AssessmentLink,
  AssessmentResposta,
  AssessmentCalculo,
  AssessmentQuestion,
} from '@/lib/types'

interface AssessmentState {
  links: AssessmentLink[]
  respostas: AssessmentResposta[]
  calculos: AssessmentCalculo[]
  questions: AssessmentQuestion[]
  isLoading: boolean

  fetchLinks: () => Promise<void>
  fetchRespostas: () => Promise<void>
  fetchCalculos: () => Promise<void>
  fetchQuestions: () => Promise<void>
  createLink: (data: Partial<AssessmentLink>) => Promise<void>
  updateQuestion: (id: string, data: Partial<AssessmentQuestion>) => Promise<void>
  updateCalculo: (id: string, data: Partial<AssessmentCalculo>) => Promise<void>
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
  links: [],
  respostas: [],
  calculos: [],
  questions: [],
  isLoading: false,

  fetchLinks: async () => {
    set({ isLoading: true })
    try {
      const records = await pb.collection('v1_assessment_links').getFullList<AssessmentLink>({
        sort: '-created',
        expand: 'cliente_id',
      })
      set({ links: records })
    } catch (error) {
      console.error('Failed to fetch assessment links:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchRespostas: async () => {
    set({ isLoading: true })
    try {
      const records = await pb
        .collection('v1_assessment_respostas')
        .getFullList<AssessmentResposta>({
          sort: '-created',
          expand: 'link_id,cliente_id',
        })
      set({ respostas: records })
    } catch (error) {
      console.error('Failed to fetch assessment respostas:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCalculos: async () => {
    try {
      const records = await pb.collection('v1_assessment_calculos').getFullList<AssessmentCalculo>({
        expand: 'resposta_id',
      })
      set({ calculos: records })
    } catch (error) {
      console.error('Failed to fetch assessment calculos:', error)
    }
  },

  fetchQuestions: async () => {
    try {
      const records = await pb
        .collection('v1_assessment_questions')
        .getFullList<AssessmentQuestion>({
          sort: 'order',
        })
      set({ questions: records })
    } catch (error) {
      console.error('Failed to fetch assessment questions:', error)
    }
  },

  createLink: async (data) => {
    await pb.collection('v1_assessment_links').create(data)
    useAssessmentStore.getState().fetchLinks()
  },

  updateQuestion: async (id, data) => {
    await pb.collection('v1_assessment_questions').update(id, data)
    useAssessmentStore.getState().fetchQuestions()
  },

  updateCalculo: async (id, data) => {
    await pb.collection('v1_assessment_calculos').update(id, data)
    useAssessmentStore.getState().fetchCalculos()
  },
}))

export default useAssessmentStore
