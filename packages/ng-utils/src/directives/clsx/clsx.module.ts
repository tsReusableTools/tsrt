import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClsxDirective } from './clsx.directive';

@NgModule({
  declarations: [ClsxDirective],
  imports: [CommonModule],
  exports: [ClsxDirective],
})
export class ClsxModule { }
