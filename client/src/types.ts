export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type User = { id:number; name:string; email:string; role:Role };
export type Student = {
  id:number; student_id:string; admission_number:string; first_name:string; last_name:string;
  gender:string; date_of_birth?:string; email?:string; phone?:string; address?:string;
  guardian_name?:string; guardian_phone?:string; department_id:number; program_id:number;
  department_name?:string; program_name?:string; year_level:number; semester:number;
  admission_date:string; status:string; notes?:string;
};
