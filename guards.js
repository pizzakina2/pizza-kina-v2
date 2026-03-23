export function hasRole(staffDoc, role) {
  return Boolean(staffDoc?.roles?.[role]);
}
