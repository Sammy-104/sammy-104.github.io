const fs = require('fs');
const sharp = require(process.env.SHARP_PATH);
(async () => {
  const paths = [...Array.from({length:7}, (_,i) => 'about-0'+(i+1)+'.jpg'), 'drift-receive-dark.png', 'vollo-microsoft-store.png', 'library-catalogue.png', 'library-login.png'];
  for (const name of paths) {
    const input = 'media/' + name;
    const metadata = await sharp(input).metadata();
    const oriented = metadata.autoOrient || {width:metadata.width,height:metadata.height};
    for (const width of [640,960]) {
      const output = name.replace(/\.[^.]+$/, '-') + width + '.webp';
      const buffer = await sharp(input).autoOrient().resize({width,withoutEnlargement:true}).webp({quality:88,effort:6}).toBuffer();
      for (let offset=0,index=0;offset<buffer.toString('base64').length;offset+=16000,index++) {
        console.log('MEDIA_CHUNK '+JSON.stringify({name:output,index,data:buffer.toString('base64').slice(offset,offset+16000)}));
      }
      console.log('MEDIA_INFO '+JSON.stringify({original:name,preview:output,width:Math.min(width,oriented.width),originalWidth:oriented.width,originalHeight:oriented.height,bytes:buffer.length}));
    }
  }
  const logo = await sharp('media/vollo-microsoft-store.png').extract({left:201,top:171,width:105,height:105}).webp({lossless:true,effort:6}).toBuffer();
  console.log('MEDIA_CHUNK '+JSON.stringify({name:'vollo-logo.webp',index:0,data:logo.toString('base64')}));
  console.log('MEDIA_INFO '+JSON.stringify({original:'logo',preview:'vollo-logo.webp',width:105,bytes:logo.length}));
})().catch(error => { console.error(error); process.exitCode = 1; });
