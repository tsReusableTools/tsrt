import { Request, Response, NextFunction } from 'express';

// import { AuthService } from '@lib/services';
import { SessionService } from '@tsu/api';
// import { ROUTES, BASE_URL } from '@app/utils/config';

/** Redirect if session exists to client root */
// export const redirectIfSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const { session } = req;
//
//   const checkSession = await SessionService.checkSession(session);
//
//   // If there is correct session -> user is loggedIn -> redirect to dashboard
//   if (checkSession) {
//     const verified = await AuthService.verify(session);
//     if (verified.status >= 400) next();
//     else return res.redirect(BASE_URL);
//   } else next();
// };
//
// /** Redirect if session doesn't exist to login */
// export const redirectIfNoSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const { session } = req;
//
//   const checkSession = await SessionService.checkSession(session);
//
//   // If there is correct session -> user is loggedIn -> redirect to dashboard
//   if (!checkSession) return res.redirect(ROUTES.LOGIN);
//
//   const verified = await AuthService.verify(session);
//   if (verified.status >= 400) return res.redirect(ROUTES.LOGIN);
//
//   next();
// };

/**
 *  Verifies session, decoding it.
 *  IMPORTANT !!! Disabled for now, as there is different user-agent header if open app in
 *  browser in 'mobile' mode (emulating some device, ex: iPhone)
 */
// export const verifySession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const { headers, session } = req;
//   const { 'user-agent': userAgent } = headers;
//
//   // If no session -> go next
//   if (!session) return next();
//
//   const decrypted = SessionService.decrypt(session.id);
//
//   // Verify session: host & ip
//   const equalHost = userAgent === decrypted.host;
//
//   if (!equalHost) {
//     await SessionService.destroy(session, res);
//     return res.redirect(ROUTES.LOGIN);
//   }
//
//   next();
// };

/** Removes extra sessions */
export async function removeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  await SessionService.checkSession(req.session, res);
  next();
}
