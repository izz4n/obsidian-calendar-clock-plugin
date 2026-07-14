const { Plugin, PluginSettingTab, Setting } = require('obsidian');

const DEFAULT_SETTINGS = {
    hour12: false,
    showSeconds: true
};

module.exports = class CalendarClockPlugin extends Plugin {
    async onload() {
        console.log('Loading Calendar Clock Companion...');

        // Load persisted user settings
        await this.loadSettings();

        // Add the native settings tab
        this.addSettingTab(new CalendarClockSettingTab(this.app, this));
        
        // Update the clock every second
        this.registerInterval(
            window.setInterval(() => this.updateClock(), 1000)
        );
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateClock() {
        // Targets Liam Cain's calendar container
        const calendarContainers = document.querySelectorAll('#calendar-container');
        if (calendarContainers.length === 0) return;
        
        const now = new Date();
        
        // Generate formatting options based on active settings
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: this.settings.hour12
        };

        if (this.settings.showSeconds) {
            options.second = '2-digit';
        }
        
        const timeString = now.toLocaleTimeString([], options);
        
        calendarContainers.forEach(container => {
            let clockEl = container.querySelector('.calendar-clock-companion');
            
            if (!clockEl) {
                clockEl = document.createElement('div');
                clockEl.className = 'calendar-clock-companion';
                
                // Styling that natively scales with the current active theme
                clockEl.style.fontSize = '1.3em';
                clockEl.style.fontWeight = '600';
                clockEl.style.textAlign = 'center';
                clockEl.style.padding = '10px 0';
                clockEl.style.margin = '0 0 10px 0';
                clockEl.style.color = 'var(--text-accent)'; 
                clockEl.style.borderBottom = '1px solid var(--background-modifier-border)';
                clockEl.style.letterSpacing = '1px';
                clockEl.style.fontFamily = 'var(--font-monospace)'; // Keep numbers from wiggling
                
                container.insertBefore(clockEl, container.firstChild);
            }
            clockEl.textContent = timeString;
        });
    }
    
    onunload() {
        console.log('Unloading Calendar Clock Companion...');
        // Remove clock elements from the sidebar immediately on unload
        const clockEls = document.querySelectorAll('.calendar-clock-companion');
        clockEls.forEach(el => el.remove());
    }
}

// Settings UI Tab
class CalendarClockSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Calendar Clock Companion Settings' });

        // Toggle AM/PM
        new Setting(containerEl)
            .setName('Use 12-hour format')
            .setDesc('Toggle between 12-hour clock (AM/PM) and 24-hour military clock.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hour12)
                .onChange(async (value) => {
                    this.plugin.settings.hour12 = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateClock(); // Instantly update view without page reload
                })
            );

        // Toggle Seconds
        new Setting(containerEl)
            .setName('Show seconds')
            .setDesc('Show or hide the seconds tracker in your clock.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showSeconds)
                .onChange(async (value) => {
                    this.plugin.settings.showSeconds = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateClock(); // Instantly update view
                })
            );
    }
}