
declare namespace NepaliDatepicker {
  interface NepaliDatepickerConfig {
    dateFormat?: string;
    ndpYear?: boolean;
    ndpMonth?: boolean;
    ndpYearCount?: number;
    disableBefore?: string;
    disableAfter?: string;
    onChange?: () => void;
    closeOnDateSelect?: boolean;
  }
}

declare namespace NepaliDateConverter {
  interface NepaliDateFunctions {
    BS2AD: (bsDate: string) => string;
    AD2BS: (adDate: string) => string;
    ConvertDateFormat: (date: string, format: string) => string;
  }
}

declare global {
  interface Window {
    NepaliFunctions: NepaliDateConverter.NepaliDateFunctions;
    $: any;
  }
  
  interface HTMLInputElement {
    nepaliDatePicker: (config?: NepaliDatepicker.NepaliDatepickerConfig) => void;
  }
}

export {};
