import type { ReactNode } from "react";
import { requireAdminSession } from "@/lib/auth/authorization";

type Props = {
  children: ReactNode;
};

export default async function ManagementLayout({ children }: Props) {
  await requireAdminSession();

  return children;
}
