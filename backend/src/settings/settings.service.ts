import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async getSettings() {
    const settings = await this.settingsRepo.find();
    if (settings.length === 0) {
      return {};
    }
    return settings[0].value;
  }

  async saveSettings(value: any) {
    let setting = await this.settingsRepo.findOne({ where: { key: 'global_settings' } });
    if (!setting) {
      setting = this.settingsRepo.create({ key: 'global_settings', value });
    } else {
      setting.value = value;
    }
    await this.settingsRepo.save(setting);
    return setting.value;
  }
}
