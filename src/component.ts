import { Injections } from "./pyrite";
import { RouteParams } from "./router";

export class PyriteComponent {
	static setRefs(output: any, elements: any) {
		elements.forEach((element: any) => {
			if (!element || element.tag === "#") return;

			const ref = element.attrs && element.attrs.ref;

			if (typeof element.tag === "function") {
				if (ref) output[ref] = element.state;

				return;
			}

			if (ref) output[ref] = element.dom;

			if (element.children && element.children.length) PyriteComponent.setRefs(output, element.children);
		});
	}

	static set(target: any, template: Function) {
		target.prototype.oninit = function(args:any) {
			if (this.$onInit) this.$onInit(args);
		}

		target.prototype.onbeforeupdate = function(args:any, oldArgs: any) {
			if (this.$onBeforeUpdate) this.$onBeforeUpdate(args, oldArgs);
		}

		target.prototype.onupdate = function(args:any) {
			if (this.$onUpdate) this.$onUpdate(args);
		}

		target.prototype.onbeforeremove = function(args:any) {
			if (this.$onBeforeRemove) this.$onBeforeRemove(args);
		}

		target.prototype.onremove = function(args:any) {
			if (this.$onRemove) this.$onRemove(args);
		}

		target.prototype.oncreate = function(args: any) {
			const refs = target.prototype.__refs;

			if (refs && args.instance && args.instance.children && args.instance.children.length) {
				PyriteComponent.setRefs(this[refs], args.instance.children);
			}

			if (this.$onCreate) this.$onCreate(args);
		};

		target.prototype.view = function(args: any) {
			if (target.prototype.__children) this[target.prototype.__children] = args.children;

			return template.call(this, this, args);
		};
	}

	static get(target: any, template: Function) {
		PyriteComponent.set(target, template);

		return function (this: any) {
			if (target.prototype.__inject) {
				target.prototype.__inject.forEach((inject: any) => {
					target.prototype[inject.method] = PyriteComponent.getDescendantProp(Injections, inject.name);
				});

				delete target.prototype.__inject;
			}

			const component = new target(this);

			if (target.prototype.__attributes) {
				component[target.prototype.__attributes] = {};

				Object.keys(this.attrs).forEach((attr: string) => {
					component[target.prototype.__attributes][attr] = this.attrs[attr];
				});
			}

			if (target.prototype.__refs) component[target.prototype.__refs] = {};
			if (target.prototype.__routeParams) component[target.prototype.__routeParams] = RouteParams;

			return component;
		}
	}

	static getDescendantProp(obj: any, desc: string): any {
		const arr: any = desc.split(".");

		while (arr.length && (obj = obj[arr.shift()]));

		return obj;
	}
}
