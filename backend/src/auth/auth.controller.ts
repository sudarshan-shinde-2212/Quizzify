import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';

/** URL of the frontend – used for the post-OAuth redirect */
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://quizzify-liart.vercel.app';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Admin credential login
   * POST /admin/auth/login
   * Returns { accessToken, role }
   */
  @Post('admin/auth/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  /**
   * Kick off Google OAuth flow
   * GET /auth/google  →  redirect to Google
   */
  @Get('auth/google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects automatically – no body needed
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   *
   * After successful auth, redirects the browser back to the frontend
   * with the JWT token encoded as query params so the SPA can pick it up:
   *   http://localhost:5173/?token=<jwt>&role=student&profileCompleted=true
   */
  @Get('auth/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    const params = new URLSearchParams({
      token: result.accessToken,
      role: result.role,
      profileCompleted: String(result.profileCompleted),
    });

    return res.redirect(`${FRONTEND_URL}/?${params.toString()}`);
  }
}
