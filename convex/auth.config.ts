import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // This value is configured on each Convex deployment. Keeping it in the
      // deployment environment lets development Clerk use development Convex.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
