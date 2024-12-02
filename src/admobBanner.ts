import {
    AdMob,
    BannerAdOptions,
    BannerAdSize,
    BannerAdPosition,
    BannerAdPluginEvents,
    AdMobBannerSize,
  } from '@capacitor-community/admob';
  
  export async function showBanner(): Promise<void> {
    // Aggiungi l'ascoltatore per l'evento di caricamento del banner
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('Banner Loaded');
    });
  
    // Aggiungi l'ascoltatore per l'evento di cambiamento delle dimensioni del banner
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
      console.log('Banner Size Changed', size);
    });
  
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-9010134003844365/9069352640', // Sostituisci con il tuo Banner Ad ID
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      // isTesting: true,  // Abilita per testare gli annunci
      // npa: true,        // Abilita per la politica no-personalizzazione
    };
  
    await AdMob.showBanner(options);
  }
  