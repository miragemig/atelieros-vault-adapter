import { HestiaCapture } from 'mnemosyne-capture;

class NoteStorage {
  constructor() {
    this.vaultPath = process.env.ZEUS_VAULT;
    this.noteStorage = new Storage({
      path: `notes/${this.vaultPath}`,
    });
  }

  async saveNote(note) {
    return await this.noteStorage.createNote(note);
  }
}

const note = 'Markdown note written to G:\\ZEUS\\VAULT';
const vaultPath = process.env.ZEUS_VAULT;
const noteStorage = await storage.createNote(note, { path: `notes/${vaultPath}` });