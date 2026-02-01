"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"
import { loginAdmin } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialState = { error: "" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  )
}

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(loginAdmin, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-3">
            <Input name="username" placeholder="Username" autoComplete="username" />
            <div className="space-y-2">
              <Input
                name="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <SubmitButton />
          </form>
          <p className="text-xs text-muted-foreground">
            This login is separate from normal user accounts.
          </p>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            Back to website
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
