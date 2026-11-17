"use client"

import { useActionState } from "react"
import { cn } from "cn"

import { login } from "@/app/(auth)/login/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(login, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Usuario</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Validando..." : "Ingresar"}
                </Button>
                {state.error ? (
                  <FieldDescription className="text-destructive" aria-live="polite">
                    {state.error}
                  </FieldDescription>
                ) : null}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
