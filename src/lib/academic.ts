import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Academic directory lookups (universities, faculties, departments, levels,
 * semesters). These are publicly readable so registration works before sign-in.
 */

export type University = { id: string; name: string; code: string | null; country: string };
export type Faculty = { id: string; university_id: string; name: string; code: string | null };
export type Department = { id: string; faculty_id: string; name: string; code: string | null };
export type AcademicLevel = { id: string; code: string; name: string; position: number };
export type Semester = { id: string; code: string; name: string; position: number };

export const academicKeys = {
  universities: ["academic", "universities"] as const,
  faculties: (universityId: string | null) => ["academic", "faculties", universityId] as const,
  departments: (facultyId: string | null) => ["academic", "departments", facultyId] as const,
  levels: ["academic", "levels"] as const,
  semesters: ["academic", "semesters"] as const,
};

export function universitiesOptions() {
  return queryOptions({
    queryKey: academicKeys.universities,
    queryFn: async (): Promise<University[]> => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, code, country")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as University[];
    },
    staleTime: 5 * 60_000,
  });
}

export function facultiesOptions(universityId: string | null) {
  return queryOptions({
    queryKey: academicKeys.faculties(universityId),
    enabled: Boolean(universityId),
    queryFn: async (): Promise<Faculty[]> => {
      const { data, error } = await supabase
        .from("faculties")
        .select("id, university_id, name, code")
        .eq("university_id", universityId as string)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Faculty[];
    },
    staleTime: 5 * 60_000,
  });
}

export function departmentsOptions(facultyId: string | null) {
  return queryOptions({
    queryKey: academicKeys.departments(facultyId),
    enabled: Boolean(facultyId),
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, faculty_id, name, code")
        .eq("faculty_id", facultyId as string)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
    staleTime: 5 * 60_000,
  });
}

export function levelsOptions() {
  return queryOptions({
    queryKey: academicKeys.levels,
    queryFn: async (): Promise<AcademicLevel[]> => {
      const { data, error } = await supabase
        .from("academic_levels")
        .select("id, code, name, position")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as AcademicLevel[];
    },
    staleTime: 30 * 60_000,
  });
}

export function semestersOptions() {
  return queryOptions({
    queryKey: academicKeys.semesters,
    queryFn: async (): Promise<Semester[]> => {
      const { data, error } = await supabase
        .from("semesters")
        .select("id, code, name, position")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as Semester[];
    },
    staleTime: 30 * 60_000,
  });
}

export function useUniversities() {
  return useQuery(universitiesOptions());
}
export function useFaculties(universityId: string | null) {
  return useQuery(facultiesOptions(universityId));
}
export function useDepartments(facultyId: string | null) {
  return useQuery(departmentsOptions(facultyId));
}
export function useLevels() {
  return useQuery(levelsOptions());
}
export function useSemesters() {
  return useQuery(semestersOptions());
}
