import { iconIndex } from './gel_icon_index.js';
import { Gel, css } from 'gelamint'
  

function camelCaseToDashSep(str) {  
   return str.toLowerCase() !== str ?
      str.replace(/[A-Z]/g, match => ("-"+match.toLowerCase()))
      : str
} 

const iconBank =  { 
 
   availableIcons: Object.keys(iconIndex) ,  

   iconExists: iName => iName == 'spacer' || iconBank.availableIcons.includes(iName),

   icons: Gel.el('template', { contents :
      Object.entries(iconIndex).map( ([key,def]) => {
         const dashSepName = camelCaseToDashSep(key)
         return Gel.el('template', { 
            'class': dashSepName + ' svg-template',
            contents: Gel.el('svg', {
               contents: def.contents, 
               viewBox:  def.viewBox,
               class: `gel-${dashSepName}-icon icon` 
            })
         })
      }) }
   ),  

   getNames: function(el, attr) {   
      if (el.hasAttribute('all'))
         return iconBank.availableIcons; 
      return (el.hasAttribute(attr) ?
                  el.getAttribute(attr).split(/[\,\s]/g)
                  : el.getAttributeNames()
            ).filter( name => name.includes(':') ?
               !( name.split(':').map(iconBank.iconExists).includes(false) )
               : iconBank.iconExists(name)
            ) 
   }, 

   getIcon: function(name) { 
      const findTmpl = n => iconBank.icons.content.querySelector(`template.${n}.svg-template`),
            icon = [ name, ...(camelCaseToDashSep(name).split('-').filter( n => n.length > 0)) ]
                     .find(findTmpl); 
         return  findTmpl(icon)?.content.cloneNode(true) ?? null 
   }, 
  
   makeButton: (name, opts, stack = [].concat(name.includes(':') ? name.split(':') : name)) =>
      name == 'spacer' ?
         Gel.el('span', { class: `gel-strip-spacer`, style: 'margin: 0 0 0 -.5rem; pointer-events: none; user-select: none;'}) 
         :
         Gel.el('button', { 
         contents: stack.map( n =>
            [  Gel.el('span', { class: 'button-description', contents: n }),
               iconBank.getIcon(n).children[0] 
            ]).flat(),
         class: `gel-button ` + stack.join(' '),   
         title: stack.join(' & ') + ' button',
         type: 'button',
         listeners: (opts && opts.noListeners ? undefined :
         ({ 
               dblclick:    function(e) { e.stopPropagation() },
               pointerdown: function(e) { e.stopPropagation() }, 
               click: function(e) {    
                  this.dispatchEvent(
                     new CustomEvent('gel-button-command', {
                        bubbles: false,
                        composed: true,
                        detail : { name }
                     })
                  )}
               }
            ))   
         }) 
   }
 
 
Object.entries({
   'gel-icon': function() {  
      if (this.name.length)  
         this.replaceChildren(iconBank.getIcon(this.name))    
   },
   'gel-btn': function(opts) {  
      this.replaceChildren(iconBank.makeButton(camelCaseToDashSep(this.name), opts))
   },
   'gel-strip': function( ) {   
      this.replaceChildren( Gel.el('template', {
         contents: [].concat(this.name).map( name => 
            iconBank.makeButton(camelCaseToDashSep(name) ))  
      }).content )
   }
}).forEach( ([elTag, initFunc]) => {
   if (customElements.get(elTag) === undefined) {
      const nameAttr = {
         'gel-icon'  : 'icon',
         'gel-btn'   : 'button',
         'gel-strip' : 'buttons'
      }[elTag]; 
      customElements.define(elTag, class extends HTMLElement{
         static get observedAttributes() { return [ nameAttr ] }
         constructor() { super() }
         attributeChangedCallback(prop, oldVal, newVal) { this.initialize() }
         connectedCallback(){
            this.classList.add('gel');
            if (this.hasAttribute('no-listeners'))  
               this.opts = { noListeners: true } 
            this.initialize() 
         } 
         initialize() {
            let names = iconBank.getNames(this, nameAttr)  
            if (names.length === 1) { names = names[0] } 
            if (!this.name || (this.name && this.name !== names)){
               this.name = names;
               initFunc.call(this, this.opts ?? {})
            } 
         } 
      }) 
   }
}) 





function incrIndex(arr, index, incr) {
      let currVal = index + incr
      if (currVal < 0) return (arr.length - 1)
      else if (currVal > arr.length - 1) return 0 
      return currVal
   }

   function setButtonAttr(incr, context, options = iconBank.availableIcons ) {
      context.scrollButton?.setAttribute('button',
      options[incrIndex(options, options.indexOf(context.scrollButton.getAttribute('button')), incr) ])
   } 
   function advance(incr, self = this) { setButtonAttr(incr, self) } 
   function scroll(e,     self = this) { setButtonAttr(e.deltaY > 0 ? 1 : -1, self) }



Gel.mint('gelicon-scroller' , () => ({
      styles: `  
         :host { 
            position: relative; 
            width: 100%;
            height: 100%;
            display: flex;
            flex-gap: .5rem;
            flex-flow: row nowrap;
         } 
         * {
            font-family: var(--gel-font-mono)
         } 
         gel-btn#scroll-button, gel-btn#scroll-button * {
            cursor: initial
         } 
         gel-btn#scroll-button {
            flex: 1 1 auto
         } 
         gel-btn#scroll-button button svg {  
            fill: var(--gel-ui-foreground);
            margin: 0 auto;  
            width: 67%;
            height: 67%;
         }
         gel-btn#scroll-button span.button-description {
            position: absolute;
            width: 100%;
            color: var(--gel-ui-foreground);
            top: 0; left: 0;
            font-size: 300%;   
            visibility: visible;
            opacity: 1;
            transform: translateY( -100%) scale(1);  
         }  
         .side-button { 
            flex: 0 1 auto; 
            padding: 0 1rem 0 1rem;
            height: 100%; 
            transition: background-color 222ms ease-in-out, opacity 222ms ease-in-out; 
            opacity: .3;
            max-width: min(5rem, 15%); 
         }  
         gel-btn.side-button span   { display: none; }
         gel-btn.side-button:hover  { background-color: rgba( 0, 0, 0, .1); opacity: .5; }  
         `,
 
      elRefs: {
         'scrollButton': 'gel-btn#scroll-button'  
      }, 

      template: `  
         <gel-btn
            id= "downbutton"
            class= "side-button"
            button= "down">
         </gel-btn>

         <gel-btn no-listeners
            id= "scroll-button"
            class= "gel"
            button= "${iconBank.availableIcons[0]}">
         </gel-btn>
 
         <gel-btn
            id= "upbutton"
            class= "side-button" 
            button= "up">
         </gel-btn>`,
 
      children() { 
         return [
            [ 'gel-btn#upbutton',   'click', (e) => advance.call(this,1)],
            [ 'gel-btn#downbutton', 'click', (e) => advance.call(this,-1)],
            [ `gel-btn#scroll-button`, 'wheel', scroll.bind(this), { passive: true, bubbles: false, composed: false  }]
         ]
      } 
   })
 ) 
   
 
