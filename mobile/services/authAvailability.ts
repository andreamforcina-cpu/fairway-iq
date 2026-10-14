/** Local capability declaration, not an authentication API or simulated login. */
export async function checkAuthenticationAvailability(): Promise<{ available: false }> {
  return { available: false };
}
