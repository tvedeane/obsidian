const { Plugin, Notice, TFile } = require('obsidian');

module.exports = class TransactionDuplicatorPlugin extends Plugin {
    async onload() {
        // Add command to duplicate transaction
        this.addCommand({
            id: 'duplicate-transaction',
            name: 'Duplicate transaction for next period',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.duplicateTransaction(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        // Add ribbon icon
        this.addRibbonIcon('copy-plus', 'Duplicate transaction', () => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                this.duplicateTransaction(activeFile);
            } else {
                new Notice('No active file');
            }
        });
    }

    async duplicateTransaction(file) {
        try {
            // Read the file content
            const content = await this.app.vault.read(file);
            
            // Parse the filename to extract base name and date
            const filename = file.basename;
            const match = filename.match(/^(.+?)\s+(\d{4})-(\d{2})$/);
            
            if (!match) {
                new Notice('File name does not match expected format (e.g., "Berliner Stadtwerke 2022-10")');
                return;
            }

            const baseName = match[1];
            const year = match[2];
            const month = match[3];
            
            // Calculate next period
            let newYear = parseInt(year);
            let newMonth = parseInt(month);
            
            newMonth++;
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }

            const newMonthStr = newMonth.toString().padStart(2, '0');
            const newFilename = `${baseName} ${newYear}-${newMonthStr}`;
            
            // Update the Data field with current date
            const today = new Date();
            const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Replace the Data field
            const updatedContent = content.replace(
                /^Data:\s*.+$/m,
                `Data: ${currentDate}`
            );
            
            // Create new file
            const newFilePath = file.parent 
                ? `${file.parent.path}/${newFilename}.md`
                : `${newFilename}.md`;
            
            // Check if file already exists
            const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
            if (existingFile) {
                new Notice(`File "${newFilename}" already exists`);
                return;
            }
            
            await this.app.vault.create(newFilePath, updatedContent);
            
            new Notice(`Created: ${newFilename}`);
            
            // Optionally open the new file
            const newFile = this.app.vault.getAbstractFileByPath(newFilePath);
            if (newFile instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(newFile);
            }
            
        } catch (error) {
            console.error('Error duplicating transaction:', error);
            new Notice('Error duplicating transaction');
        }
    }

    onunload() {
        // Cleanup if needed
    }
}

