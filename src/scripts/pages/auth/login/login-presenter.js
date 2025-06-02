export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();

    try {
      const response = await this.#model.login({ email, password });
      console.log('Response from server:', response);

      if (!response) {
        this.#view.loginFailed('Server response is invalid.');
        return;
      }

      if (response.error) {
        this.#view.loginFailed(response.message || 'Login failed');
        return;
      }

      const token = response.loginResult?.token;
      
      if (token) {
        this.#authModel.putAccessToken(token);
        this.#view.loginSuccessfully('Login berhasil!');
      } else {
        console.error('Access Token is missing in the response');
        this.#view.loginFailed('Token tidak ditemukan di response.');
      }
    } catch (error) {
      console.error('getLogin: error:', error);
      this.#view.loginFailed(error.message || 'Terjadi kesalahan saat login');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}