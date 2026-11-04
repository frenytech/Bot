import { Label } from "@/components/ui/label";
import { useDepartments, useFaculties, useLevels, useSemesters, useUniversities } from "@/lib/academic";

export type AcademicValues = {
  university_id: string;
  faculty_id: string;
  department_id: string;
  academic_level_id: string;
  semester_id: string;
};

export const emptyAcademic: AcademicValues = {
  university_id: "",
  faculty_id: "",
  department_id: "",
  academic_level_id: "",
  semester_id: "",
};

const selectCls =
  "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

/** Cascading university → faculty → department pickers plus level and semester. */
export function AcademicFields({
  value,
  onChange,
}: {
  value: AcademicValues;
  onChange: (v: AcademicValues) => void;
}) {
  const unis = useUniversities();
  const facs = useFaculties(value.university_id || null);
  const deps = useDepartments(value.faculty_id || null);
  const levels = useLevels();
  const sems = useSemesters();

  const field = (
    label: string,
    key: keyof AcademicValues,
    options: { id: string; name: string }[] | undefined,
    reset: Partial<AcademicValues> = {},
  ) => (
    <div>
      <Label htmlFor={key}>{label}</Label>
      <select
        id={key}
        className={selectCls}
        value={value[key]}
        onChange={(e) => onChange({ ...value, ...reset, [key]: e.target.value })}
      >
        <option value="">{options?.length ? "Select…" : "None available yet"}</option>
        {options?.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("University", "university_id", unis.data, { faculty_id: "", department_id: "" })}
      {field("Faculty", "faculty_id", facs.data, { department_id: "" })}
      {field("Department", "department_id", deps.data)}
      {field("Level", "academic_level_id", levels.data)}
      {field("Semester", "semester_id", sems.data)}
    </div>
  );
}
