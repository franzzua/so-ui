import HyperHTMLElement from "hyperhtml-element";
import {Observable, Subject} from "./rx";
import {UI} from "./ui";

const definitions: Function[] = [];

export function defineComponents() {
    definitions.forEach(f => f());
}

export function Component(info: {
    name: string,
    observedAttributes?: string[],
    booleanAttributes?: string[],
    template: Function,
    style: Function
}) {
    return (target) => {
        let Id = 0;
        const elementConstructor = class extends HyperHTMLElement {
            static observedAttributes = info.observedAttributes || [];
            static booleanAttributes = info.booleanAttributes || [];
            private component: ComponentExtended<any>;
            private _id = Id++;
            handlerProxy: any;

            renderState(state) {
                const strs = [];
                let raw = '';
                const vals = [];
                const html = (strings, ...values) => {
                    raw += strings.raw;
                    if (strs.length) {
                        strs.push(strs.pop() + strings[0]);
                        strs.push(...strings.slice(1));
                    } else {
                        strs.push(...strings);
                    }
                    vals.push(...values);
                };
                info.template(html, state, this.handlerProxy);
                // console.log(strs);
                // console.log(vals);
                if (typeof info.style === "function") {
                    info.style(html, state);
                } else {
                    html`${info.style}`;
                }
                // console.log(strs);
                // console.log(vals);
                strs['raw'] = raw;
                this.html(strs as any, ...vals);
                this.component.Render$.next();
            }

            created() {
                // const dependencies = Reflector.paramTypes(target).map(type => Container.get(type));
                this.component = UI.container.get(target);//new target(...dependencies);
                this.component.element = this;
                this.component['id'] = this._id;
                this.handlerProxy = new Proxy({}, {
                    get: (target, key) => this.dispatchEvents(key)
                });
                this.component.State$.subscribe(state => {
                    this.renderState(state);
                });
                this.component.Actions$.subscribe();
                this.component.created();
            }

            dispatchEvents = type => (...args: any[]) => this.component._eventsSubject$.next({
                args: args,
                type: type
            });

            attributeChangedCallback(name: string, prev: string, curr: string) {
                this.component._attributesSubject$.next({name, value: curr});
            }
        };
        if (UI.container) {
            elementConstructor.define(info.name);
        } else {
            definitions.push(() => elementConstructor.define(info.name))
        }
    }
}

interface ComponentExtended<TState> {
    _attributesSubject$: Subject<{ name, value }>;
    _eventsSubject$: Subject<{ args: any[]; type: string }>;

    State$: Observable<TState>;
    Actions$: Observable<{ type: string; payload?: any }>;
    defaultState: TState;

    Render(html, state: TState, events);

    Render$: Subject<any>;

    created();

    element: Element;

    select<E extends Element = Element>(selectors: string): Observable<E | null>;
}

export type IEventHandler<TEvents> = {
    [K in keyof TEvents]: (Event) => void
};

