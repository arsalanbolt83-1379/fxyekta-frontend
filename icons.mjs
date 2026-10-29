const names=new Set(['arrow-up-right','arrow-down','arrow-down-left','menu','close']);
export function icon(name){
 if(!names.has(name))throw new Error('Unknown UI icon');
 return `<svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="/assets/ui-icons.svg#${name}"></use></svg>`;
}
