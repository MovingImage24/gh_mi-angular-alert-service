declare namespace angular.mi.alertService {

    interface IAlert {
        type: string;
        msg: string;
        close: Function;
    }

    interface IExclude {
        statusCodes: number[];
    }

    interface ICustomMessage {
        status: number;
        code: number;
        message: string;
    }

    interface IErrorMessage {
        custom: ICustomMessage[];
    }

    interface IAlertService {
        add(type: string, message: string, timeout?: number):void;
        closeAlert(alert: IAlert):IAlert[];
        closeAlertIdx(index: number):IAlert[];
        clear():void;
    }


    interface IResponseErrorInterceptorProvider {
        /**
         * example for PATCH Request:
         * 'url', 'PATCH', 'error-translation-key'
         *
         * example for exclude http-status:400 with response error-code:100
         * 'url', 'PATCH', {custom: [{status: 400,code: 100,message: 'my custom error message'}], default: 'error default'}
         *
         * example for exclude some status codes
         * 'url', 'PATCH', 'error-translation-key', {statusCodes: [400, 401, 402, 403]}
         *
         * @param {string} errorUrl
         * @param {string} method
         * @param {string|Object} errorMessage
         * @param {Object=} exclude
         */
        addErrorHandling(errorUrl: string, method: string, errorMessage: string | IErrorMessage, exclude?: IExclude):void
    }
}