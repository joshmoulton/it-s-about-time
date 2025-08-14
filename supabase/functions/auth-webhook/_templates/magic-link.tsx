import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface MagicLinkEmailProps {
  magicLink: string;
  userTier: string;
  email: string;
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
        <Heading style={h1}>Weekly Wizdom</Heading>
        
        <Text style={text}>
          Click the button below to securely access your Weekly Wizdom account:
        </Text>
        
        <Link
          href={magicLink}
          target="_blank"
          style={{
            ...button,
            display: 'block',
            marginBottom: '24px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center' as const,
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          Sign In to Your Account
        </Link>
        
        <Text style={{ ...text, fontSize: '14px', color: '#6b7280' }}>
          This link expires in 15 minutes for security. If you didn't expect this invitation, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          <Link
            href="https://www.weeklywizdom.com"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Weekly Wizdom
          </Link>
          <br />
          Your weekly dose of crypto market wisdom
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const link = {
  color: '#2563eb',
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  margin: '24px 0',
  lineHeight: '24px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
};