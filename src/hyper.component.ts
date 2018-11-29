import {map, NEVER, Observable, of, ReplaySubject, scan, startWith} from "./rx";

export abstract class HyperComponent<TState = any, TEvents = any> {

    protected element: Element;

    State$: Observable<TState> = of(null);
    Actions$: Observable<{ type: string; payload?: any }> = NEVER;

    // abstract Render(html, state: TState, events: IEventHandler<TEvents>);

    created() {

    }

    protected defaultState: TState;
    private _attributesSubject$ = new ReplaySubject<{ name, value }>();
    private _eventsSubject$ = new ReplaySubject<{ args: any[]; type: keyof TEvents; }>();
    protected Events$ = this._eventsSubject$.asObservable();
    protected Attributes$: Observable<any> = this._attributesSubject$.asObservable().pipe(
        scan<{ name, value }, any>((acc, val) => ({...acc, [val.name]: val.value}), {}),
        startWith({}),
    );

    protected Render$ = new ReplaySubject();

    protected select<E extends Element = Element>(selector: string): Observable<E | null> {
        return this.Render$.asObservable().pipe(
            map(_ => this.element.querySelector(selector))
        );
    }
}