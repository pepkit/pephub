import { ProjectAnnotation } from '../../types'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE

export interface NamespaceResponse {
    namespace: string
    number_of_projects: number
    number_of_samples: number
    projects_endpoint: string
}

export interface NamespaceProjectsResponse {
    count: number
    offset: number
    limit: number
    items: ProjectAnnotation[]
}

export const getNamespaceInfo = (namespace: string) => {
    const url = `${API_BASE}/namespaces/${namespace}/` // note the trailing slash
    return axios.get<NamespaceResponse>(url).then(res => res.data)
}

export const getNamespaceProjects = (namespace: string) => {
    const url = `${API_BASE}/namespaces/${namespace}/projects`
    return axios.get<NamespaceProjectsResponse>(url).then(res => res.data)
}