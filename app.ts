import { Application, IBoot } from 'egg';
import { join } from 'path';

export default class AppBoot implements IBoot {
  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly app: Application) {}

  configWillLoad() {
    // Ready to call configDidLoad,
    // Config, plugin files are referred,
    // this is the last chance to modify the config.
  }

  configDidLoad() {
    // Config, plugin files have loaded.
  }

  async didLoad() {
    // 所有的配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义的服务
    console.log('axxxxx');
    this.app.loader.loadToApp(join(this.app.config.baseDir, 'app/mq'), 'mq', {
      initializer: (Cls: any) => {
        return new Cls(this.app);
      },
    });
  }


  async willReady() {
    // All plugins have started, can do some thing before app ready.
  }

  async didReady() {
    // Worker is ready, can do some things
    // don't need to block the app boot.
  }

  async serverDidReady() {
    // Server is listening.
  }

  async beforeClose() {
    // Do some thing before app close.
  }

}
