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
        <Heading style={h1}>Weekly Wizdom Access</Heading>
        
        <Text style={text}>
          Hello! Click the link below to securely access your Weekly Wizdom account:
        </Text>
        
        <Link
          href={magicLink}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            textAlign: 'center' as const,
          }}
        >
          Access Weekly Wizdom →
        </Link>
        
        <Text style={text}>
          <strong>Account Details:</strong><br />
          Email: {email}<br />
          Subscription Tier: <span style={{ textTransform: 'capitalize' }}>{userTier}</span>
        </Text>
        
        <Text style={{ ...text, color: '#666', fontSize: '14px' }}>
          This link will expire in 24 hours for your security. If you didn't request this login link, you can safely ignore this email.
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

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '24px 0',
  lineHeight: '26px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
};