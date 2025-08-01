
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MagicLinkEmailProps {
  supabase_url?: string
  email_action_type?: string
  redirect_to?: string
  token_hash?: string
  token: string
  user_email: string
  magic_link_url: string
  is_new_user?: boolean
  user_tier?: string
}

export const MagicLinkEmail = ({
  token,
  user_email,
  magic_link_url,
  is_new_user = false,
  user_tier = 'free',
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>{is_new_user ? 'Welcome to Weekly Wizdom!' : 'Access your Weekly Wizdom account'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoContainer}>
          <Heading style={h1}>Weekly Wizdom</Heading>
        </div>
        
        {is_new_user ? (
          <>
            <Heading style={h2}>Welcome to Weekly Wizdom! 🎉</Heading>
            <Text style={text}>
              Thank you for joining our community! We've created your free subscription and you're all set to start receiving valuable crypto insights.
            </Text>
            <Text style={text}>
              Click the button below to access your dashboard and explore all the features available to you:
            </Text>
          </>
        ) : (
          <>
            <Heading style={h2}>Access Your Account</Heading>
            <Text style={text}>
              Click the button below to securely access your Weekly Wizdom account:
            </Text>
          </>
        )}
        
        <div style={buttonContainer}>
          <Link
            href={magic_link_url}
            target="_blank"
            style={button}
          >
            {is_new_user ? 'Get Started Now' : 'Sign In to Your Account'}
          </Link>
        </div>
        
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={urlText}>{magic_link_url}</Text>
        
        {is_new_user && (
          <div style={welcomeBox}>
            <Text style={welcomeText}>
              <strong>What's Next?</strong>
            </Text>
            <Text style={welcomeText}>
              • Access your personalized dashboard<br/>
              • Read our latest newsletter insights<br/>
              • Explore premium features<br/>
              • Join our community discussions
            </Text>
          </div>
        )}
        
        <Text style={footerText}>
          This link will expire in 30 minutes for security. If you didn't request this email, you can safely ignore it.
        </Text>
        
        <Text style={footer}>
          <Link
            href="https://www.weeklywizdom.app"
            target="_blank"
            style={footerLink}
          >
            Weekly Wizdom
          </Link>
          <br />
          Your trusted source for crypto insights and trading signals.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const logoContainer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #f0f0f0',
}

const h1 = {
  color: '#1a73e8',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#1a73e8',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
}

const urlText = {
  color: '#666',
  fontSize: '14px',
  margin: '16px 20px',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f8f9fa',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #e9ecef',
}

const welcomeBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '20px',
}

const welcomeText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 20px 16px',
  textAlign: 'center' as const,
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  margin: '0 20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #f0f0f0',
  paddingTop: '20px',
}

const footerLink = {
  color: '#1a73e8',
  textDecoration: 'none',
}
