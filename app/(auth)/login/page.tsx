import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Sign In" }

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  return <LoginForm authError={error} />
}
