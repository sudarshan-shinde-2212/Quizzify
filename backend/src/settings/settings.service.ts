import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  allowRetakes: false,
  maxTabSwitches: 0, // Always 0
  questionShuffle: true,
  maintenanceMode: false,
  platformName: "Quizzify",
  autoSubmit: true,
  negativeMarking: 0,
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async getSettings() {
    this.logger.log('Fetching global settings...');
    const setting = await this.settingsRepo.findOne({ where: { key: 'global_settings' } });
    if (!setting) {
      this.logger.log('No global settings found, returning defaults:', DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const mergedSettings = { ...DEFAULT_SETTINGS, ...setting.value, maxTabSwitches: 0 }; // Enforce maxTabSwitches=0
    this.logger.log('Loaded settings:', mergedSettings);
    return mergedSettings;
  }

  async saveSettings(value: any) {
    let setting = await this.settingsRepo.findOne({ where: { key: 'global_settings' } });
    if (!setting) {
      setting = this.settingsRepo.create({ key: 'global_settings', value: { ...DEFAULT_SETTINGS, ...value, maxTabSwitches: 0 } });
    } else {
      // Merge new values into existing ones, preserving defaults if needed
      setting.value = { ...DEFAULT_SETTINGS, ...setting.value, ...value, maxTabSwitches: 0 };
    }
    await this.settingsRepo.save(setting);
    this.logger.log(`Settings saved: ${JSON.stringify(setting.value)}`);
    return setting.value;
  }
}
