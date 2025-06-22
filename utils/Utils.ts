import { App, CachedMetadata, normalizePath, Notice, parseFrontMatterEntry, TFile, TFolder } from 'obsidian';

// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
export const isFmDisable = (fileCache?: CachedMetadata) => {
	if (!fileCache) return false;

	const fm = parseFrontMatterEntry(fileCache.frontmatter, 'AutoNoteMover');
	if (fm === 'disable') {
		return true;
	} else {
		return false;
	}
};

const folderOrFile = (app: App, path: string) => {
	const F = app.vault.getAbstractFileByPath(path);
	if (F instanceof TFile) {
		return TFile;
	} else if (F instanceof TFolder) {
		return TFolder;
	}
};

const isTFExists = (app: App, path: string, F: typeof TFile | typeof TFolder) => {
	if (folderOrFile(app, normalizePath(path)) === F) {
		return true;
	} else {
		return false;
	}
};

export const fileMove = async (app: App, settingFolder: string, fileFullName: string, file: TFile, showAlert: boolean = true, autoCreateFolders: boolean = false, moveFolderNote: boolean = false) => {
	// Does the destination folder exist?
	if (!isTFExists(app, settingFolder, TFolder)) {
		console.error(`[Auto Note Mover] The destination folder "${settingFolder}" does not exist.`);
		new Notice(`[Auto Note Mover]\n"Error: The destination folder\n"${settingFolder}"\ndoes not exist.`);
		return;
	}
	// Does the file with the same name exist in the destination folder?
	const newPath = normalizePath(settingFolder + '/' + fileFullName);
	if (isTFExists(app, newPath, TFile) && newPath !== file.path) {
		console.error(
			`[Auto Note Mover] Error: A file with the same name "${fileFullName}" exists at the destination folder.`
		);
		new Notice(
			`[Auto Note Mover]\nError: A file with the same name\n"${fileFullName}"\nexists at the destination folder.`
		);
		return;
	}

	// Is the destination folder the same path as the current folder?
	if (newPath === file.path) {
		return;
	}

	// Move file
	await app.fileManager.renameFile(file, newPath);
	console.log(`[Auto Note Mover] Moved the note "${fileFullName}" to the "${settingFolder}".`);
	if (showAlert) {
		new Notice(`[Auto Note Mover]\nMoved the note "${fileFullName}"\nto the "${settingFolder}".`);
	}

	// Move folder with same name if enabled
	if (moveFolderNote) {
		const fileNameWithoutExt = fileFullName.replace('.md', '');
		const folderPath = normalizePath(file.parent.path + '/' + fileNameWithoutExt);
		const newFolderPath = normalizePath(settingFolder + '/' + fileNameWithoutExt);
		
		// Check if folder with same name exists in the same directory as the note
		if (isTFExists(app, folderPath, TFolder)) {
			// Check if destination folder already exists
			if (isTFExists(app, newFolderPath, TFolder)) {
				new Notice(`[Auto Note Mover]\nFolder "${fileNameWithoutExt}" already exists in destination.`);
				console.error(`[Auto Note Mover]\nFolder "${fileNameWithoutExt}" already exists in destination.`);
			} else {
				// Move the folder
				const folderToMove = app.vault.getAbstractFileByPath(folderPath);
				if (folderToMove instanceof TFolder) {
					await app.fileManager.renameFile(folderToMove, newFolderPath);
					console.log(`[Auto Note Mover] Moved folder "${fileNameWithoutExt}" to "${settingFolder}".`);
					if (showAlert) {
						new Notice(`[Auto Note Mover]\nMoved folder "${fileNameWithoutExt}"\nto "${settingFolder}".`);
					}
				}
			}
		}
	}

	if(autoCreateFolders) {
		const newFolderPath = normalizePath(settingFolder + '/' + fileFullName.replace('.md', ''));
		if(!isTFExists(app, newFolderPath, TFolder)) {
			await app.vault.createFolder(newFolderPath);
			console.log(`[Auto Note Mover] Created folder "${newFolderPath}".`);
		} else {
			if (showAlert) {
				new Notice(`[Auto Note Mover]\nFolder ${newFolderPath} already exists.`);
			} else {
				console.error(`[Auto Note Mover]\nFolder ${newFolderPath} already exists.`);
			}
		}
	}
};

export const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): void => {
	if (toIndex < 0 || toIndex === array.length) {
		return;
	}
	const temp = array[fromIndex];
	array[fromIndex] = array[toIndex];
	array[toIndex] = temp;
};

export const getTriggerIndicator = (trigger: string) => {
	if (trigger === 'Automatic') {
		return `[A]`;
	} else {
		return `[M]`;
	}
};
