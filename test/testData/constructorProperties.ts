export class Class1 {
    constructor(
        unstored: number,
        private priv: number,
        readonly ro: number,
        public pub: number,
        protected prot: number,
    ) {
        this.priv = unstored + priv;
    }
}
