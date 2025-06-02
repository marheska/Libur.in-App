import { getAllStories, deleteStory } from '../../utils/db';
import { generateReportItemTemplate, generateReportsListEmptyTemplate } from '../../templates';

export default class SavedDestinationsPage {
  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Destinasi Tersimpan</h1>
        <div class="reports-list__container">
          <div id="saved-reports-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.getElementById('saved-reports-list');
    const stories = await getAllStories();
    if (!stories.length) {
      container.innerHTML = generateReportsListEmptyTemplate();
      return;
    }
    container.innerHTML = stories.map(story => generateReportItemTemplate({
      id: story.id,
      title: story.title || story.name,
      description: story.description,
      reporterName: story.reporter?.name || 'Unknown',
      photo: story.photo || (story.evidenceImages ? story.evidenceImages[0] : undefined),
      photoUrl: story.photoUrl,
      image: story.image,
      evidenceImages: story.evidenceImages,
    })).join('');

    // Hapus satu per satu
    const deleteButtons = container.querySelectorAll('.delete-saved-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await deleteStory(id);
        await this.afterRender();
      });
    });

    // Tambahkan tombol 'Hapus dari Offline' di setiap item
    setTimeout(() => {
      document.querySelectorAll('.report-item').forEach((item, idx) => {
        if (!item.querySelector('.delete-offline-btn')) {
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Hapus dari Offline';
          deleteBtn.className = 'btn btn-outline delete-offline-btn';
          deleteBtn.style.marginTop = '8px';
          deleteBtn.addEventListener('click', async () => {
            const stories = await getAllStories();
            const story = stories[idx];
            if (story) {
              await deleteStory(story.id);
              alert('Cerita offline dihapus!');
              await this.afterRender();
            }
          });
          item.querySelector('.report-item__body').appendChild(deleteBtn);
        }
      });
    }, 0);
  }
}
