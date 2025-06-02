export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.register({ name, email, password });
      console.log('Registration response:', response);

      if (!response) {
        this.#view.registeredFailed('Server response is invalid.');
        return;
      }

      if (response.error) {
        this.#view.registeredFailed(response.message || 'Registration failed');
        return;
      }

      this.#view.registeredSuccessfully(response.message || 'Registration successful');
    } catch (error) {
      console.error('getRegistered: error:', error);
      this.#view.registeredFailed(error.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
