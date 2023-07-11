 import fsp from "fs/promises";
 import fs  from "fs";

// builds a 'gelicons_index.js' file from a directory of svgs, combining all the svg content
// into a single, name-keyed dictionary file that is easily consumed by other APIs

const rgx = {
   viewBox: /(?<=\bviewBox=)(['"])(.*?)\1/g,
   contents: /\<svg.*>/g
}  

const getSvgFileNames = async path => {
   const list = await fsp.readdir(path); 
   return list.filter( name => name.endsWith('.svg')); 
} 

const process = (prefix,svgs) => { 
   const dict =  {}
   svgs.forEach( svg => { 
      const contents = fs.readFileSync(prefix + svg, "utf8")
         .replace(/(?<=\w)\s*(?=\s*\=)/g,'')
         .replace(/(?<=\=)\s*(?=['"])/g,'');
      rgx.viewBox.lastIndex  = 0;
      rgx.contents.lastIndex = 0;
      const vb = contents.match(rgx.viewBox);  
      dict[svg.replace('.svg','')] = {
         contents: contents.replace(rgx.contents,'').replace('</svg>','').trim() ,
         viewBox: vb[0].slice(0,-1).slice(1) ?? ''
      };
   }) 
   return dict 
} 

const iconDict = await getSvgFileNames('./icons/').then( list => process('./icons/', list))

fs.writeFileSync(
   'gelicons_index.js', 
   `export const iconIndex = `+ JSON.stringify(iconDict, null, 4),
   "utf8"
)




 


   

