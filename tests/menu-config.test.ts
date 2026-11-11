import { expect, test } from "vitest";
import { getStaffSections } from "../src/components/menu/menu-config";

test("USER tidak memiliki menu staf", () => {
  expect(getStaffSections("USER")).toEqual([]);
});

test("MODERATOR hanya memiliki menu moderasi", () => {
  const sections = getStaffSections("MODERATOR");
  expect(sections).toHaveLength(1);
  expect(sections[0].title).toBe("Moderasi");
  expect(sections.flatMap((section) => section.links).map((link) => link.href)).not.toContain("/admin");
});

test("ADMIN memiliki seluruh tautan staf", () => {
  const links = getStaffSections("ADMIN").flatMap((section) => section.links).map((link) => link.href);
  expect(links).toEqual(expect.arrayContaining(["/moderator", "/admin", "/admin/users", "/admin/audit-logs"]));
});
