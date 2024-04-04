import Class from '../core/Class';

import zhCn from '../lang/languages/zh-CN.json';
import esMX from '../lang/languages/es-MX.json';
import enUS from '../lang/languages/en-US.json';

export interface ILanguage {
    distancetool: Distancetool
    areatool: Areatool
}

interface Distancetool {
    start: string
    units: Units
}

interface Areatool {
    units: Units
}

interface Units {
    mile: string
    feet: string
    kilometer: string
    meter: string
}

export type Lang = 'zh-CN' | 'es-MX' | 'en-US'


/**
 *  Maptalks text's language
*/
export class TranslatorError extends Error {
    constructor(msg: string) {
        super('Translator: ' + msg);
        this.name = 'TranslatorError';
    }
}

class Translator extends Class {
    languages: {
        [key: string]: ILanguage
    }
    nodes: ILanguage

    constructor(lang: Lang) {
        super();

        this.languages = {
            'zh-CN': zhCn,
            'es-MX': esMX,
            'en-US': enUS
        };
        // this.nodes = {};
        this.setLang(lang || 'zh-CN');
    }

    /**
     *  Method to update the language of maptalks
     *  @param {string} lang - Available Langs (zh-CN, en-US, es-MX)
     *  @example setLang('zh-CN')
    */
    setLang(lang: Lang) {
        const newLanguageNodes = this.languages[lang];
        if (!newLanguageNodes) throw new TranslatorError('Setted Lang does not exist');
        this.nodes = newLanguageNodes;
    }

    _validateNestedProps(nestedProps: string[]) {
        nestedProps.forEach(p => {
            if (p === '') throw new TranslatorError('Any of sides of a dot "." cannot be empty');
        });
    }
    /**
     *  method to return the text of the current language available on lang json's
     *  @param {string} textNode - Accesible property with the current language text.
     *  @return {string} Text to show in screen
     *  @example document.write(translate('areatool.units.kilometer'))
    */
    translate(textNode: string | null = null): string {
        if (textNode == null)
            throw new TranslatorError('Missing parameter textNode');
        if (typeof textNode === 'string') {
            let translatedText = null;
            if (textNode.includes('.')) {
                const nestedProps = textNode.split('.');
                if (nestedProps.length > 3) throw new TranslatorError(`Translate function can only access through 3 nested properties, trying to access -> ${nestedProps.length}`);
                this._validateNestedProps(nestedProps);

                try {
                    let translatedText = null;
                    switch (nestedProps.length) {
                        case 2:
                            translatedText = this.nodes[nestedProps[0]][nestedProps[1]];
                            break;
                        case 3:
                            translatedText = this.nodes[nestedProps[0]][nestedProps[1]][nestedProps[2]];
                            break;
                    }
                    return translatedText;
                } catch (err) {
                    throw new TranslatorError('Unable to find the text translated in lang json' + err.message);
                }
            } else {
                translatedText = this.nodes[textNode];
                return translatedText;
            }
        } else {
            throw new TranslatorError('Param passed has to be a String');
        }
    }
}

export default Translator;
