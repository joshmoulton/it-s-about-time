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
    <Preview>Sign in to Weekly Wizdom</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sign in to Weekly Wizdom</Heading>
        
        <Text style={text}>
          Click the button below to securely access your account:
        </Text>
        
        <Link
          href={magicLink}
          style={button}
        >
          Sign In
        </Link>
        
        <Text style={{ ...text, fontSize: '14px', color: '#6b7280' }}>
          If the button doesn't work, copy and paste this URL:
        </Text>
        
        <Text style={{ wordBreak: 'break-all' as const, fontSize: '12px', color: '#888' }}>
          {magicLink}
        </Text>
        
        <Text style={{ ...text, fontSize: '12px', color: '#999' }}>
          If you didn't try to login, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          <Link
            href="https://www.weeklywizdom.com"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Weekly Wizdom
          </Link>
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