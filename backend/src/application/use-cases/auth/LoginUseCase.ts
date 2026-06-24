import type { AuthService } from '../../services/AuthService.js';

export class LoginUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(username: string, password: string) {
    return this.authService.login(username, password);
  }
}
