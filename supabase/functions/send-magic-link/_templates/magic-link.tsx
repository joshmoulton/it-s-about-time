import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MagicLinkEmailProps {
  magicLink: string
  userTier: string
  email: string
}

export const MagicLinkEmail = ({
  magicLink,
  userTier,
  email,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your secure login link for Weekly Wizdom</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🪄 Weekly Wizdom</Heading>
        
        <Text style={text}>
          Hi there! Click the button below to securely sign in to your Weekly Wizdom account.
        </Text>

        <Section style={buttonContainer}>
          <Button
            href={magicLink}
            style={button}
          >
            Sign in to Weekly Wizdom
          </Button>
        </Section>

        <Text style={smallText}>
          Or copy and paste this link in your browser:
        </Text>
        
        <Text style={linkText}>
          {magicLink}
        </Text>

        <Hr style={hr} />

        <Text style={tierText}>
          Account tier: <strong>{userTier === 'premium' ? 'Premium' : 'Free'}</strong>
        </Text>

        <Text style={footerText}>
          This link will expire in 24 hours. If you didn't request this login link, you can safely ignore this email.
        </Text>

        <Text style={footer}>
          Best regards,<br />
          The Weekly Wizdom Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '100%',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 0 8px',
}

const linkText = {
  color: '#3b82f6',
  fontSize: '14px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: '0 0 20px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const tierText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  padding: '12px 16px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 20px',
}

const footer = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}