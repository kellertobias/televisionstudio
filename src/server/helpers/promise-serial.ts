export default (initialValue: any, serialActions: ((...values: any)=>Promise<any>)[]): Promise<any> => {
    return (serialActions).reduce((p, action) => {
		return p.then((...values) => {
            //Maybe call executor
            if(!action) return Promise.resolve()
            return action(...values)
        })
    }, Promise.resolve(initialValue));
}