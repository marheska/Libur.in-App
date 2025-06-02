import { reportMapper } from '../../data/api-mapper';

export default class ReportDetailPresenter {
  #reportId;
  #view;
  #apiModel;

  constructor(reportId, { view, apiModel }) {
    this.#reportId = reportId;
    this.#view = view;
    this.#apiModel = apiModel;
  }

  async showReportDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showReportDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showReportDetail() {
    this.#view.showReportDetailLoading();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Akses tidak diizinkan. Silakan login ulang.');
      const response = await this.#apiModel.getReportById(token, this.#reportId);
      if (!response || response.error || response.message === 'Unauthorized') {
        console.error('showReportDetail: response:', response);
        this.#view.populateReportDetailError(response?.message || 'Gagal mengambil detail laporan');
        return;
      }
      // Pastikan response.data jika ada, atau response langsung jika tidak ada .data
      const story = response.data || response;
      const report = await reportMapper(story);
      this.#view.populateReportDetailAndInitialMap(response.message, report);
    } catch (error) {
      console.error('showReportDetail: error:', error);
      this.#view.populateReportDetailError(error.message);
    } finally {
      this.#view.hideReportDetailLoading();
    }
  }

  async getCommentsList() {
    this.#view.showCommentsLoading();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Akses tidak diizinkan. Silakan login ulang.');
      const response = await this.#apiModel.getAllCommentsByReportId(token, this.#reportId);
      const comments = Array.isArray(response?.data) ? response.data : [];
      this.#view.populateReportDetailComments(response?.message || '', comments);
    } catch (error) {
      console.error('getCommentsList: error:', error);
      this.#view.populateCommentsListError(error.message);
    } finally {
      this.#view.hideCommentsLoading();
    }
  }

  async postNewComment({ body }) {
    this.#view.showSubmitLoadingButton();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Akses tidak diizinkan. Silakan login ulang.');
      const response = await this.#apiModel.storeNewCommentByReportId(token, this.#reportId, { body });
      if (!response.ok) {
        console.error('postNewComment: response:', response);
        this.#view.postNewCommentFailed(response.message);
        return;
      }
      this.#view.postNewCommentSuccessfully(response.message, response.data);
    } catch (error) {
      console.error('postNewComment: error:', error);
      this.#view.postNewCommentFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  showSaveButton() {
    if (this.#isReportSaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  #isReportSaved() {
    return false;
  }
}
