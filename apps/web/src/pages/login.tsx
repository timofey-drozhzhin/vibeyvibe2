import { useState } from "react";
import { useLogin } from "@refinedev/core";
import {
  Box,
  Button,
  Card,
  Center,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBrandGoogle, IconLogin } from "@tabler/icons-react";

export const LoginPage = () => {
  const { mutate: login, isPending } = useLogin<{ email: string; password: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <Center mih="100vh">
      <Card shadow="lg" padding="xl" radius="md" w={400} withBorder>
        <Stack gap="lg">
          <Box ta="center">
            <Title
              order={1}
              style={{ fontFamily: "'Righteous', cursive" }}
              size="2.5rem"
            >
              vibeyvibe
            </Title>
            <Text size="sm" c="dimmed" mt="xs">
              Sign in to your account
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <Button
                type="submit"
                fullWidth
                loading={isPending}
                leftSection={<IconLogin size={18} />}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          {googleClientId && (
            <>
              <Divider label="or" labelPosition="center" />
              <Button
                variant="default"
                fullWidth
                leftSection={<IconBrandGoogle size={18} />}
                onClick={() => {
                  window.location.href = `/api/auth/sign-in/social?provider=google`;
                }}
              >
                Continue with Google
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Center>
  );
};
