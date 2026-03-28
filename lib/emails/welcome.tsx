interface WelcomeEmailProps {
  customerName: string
}

export function WelcomeEmail({ customerName }: WelcomeEmailProps) {
  return (
    <div>
      <h1>Bienvenue sur Legend Farm Shop</h1>
      <p>Bonjour {customerName}, votre compte client est pret.</p>
    </div>
  )
}
