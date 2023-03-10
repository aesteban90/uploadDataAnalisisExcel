import React, {Component} from 'react';
import {ExcelRenderer} from 'react-excel-renderer';
import axios from 'axios';
import ProgressBar from 'react-bootstrap/ProgressBar';

export default class ExcelFacturacionForm extends Component{    
    constructor(props){
        super(props);
        this.state = {  
            cols: [],
            rows: [],
            arrayDataAnalisis: [],
            inventarios: [],
            progress: 0
        };        
    }

    componentDidMount() {
        axios.get(process.env.REACT_APP_SERVER_URL + "/inventarios/")
        .then(response => {
            this.setState({
                inventarios: response.data
            })  
        })
        .catch(err => console.log(err))
    }
    
    revisarExcel = async () =>{
        const datosImportar = [];
        const datosNotFound = [];
        const datosError = [];
        
        if(this.state.rows[0][0] === "Codigo Barra"){
            this.state.rows.map(async (data,index) => {
                if( data.length > 0 && index > 0 ) {
                    
                    const inventario = {
                        codigo: ((data[0]+"").length === 2 ? "000"+data[0] : "00"+ data[0]),
                        descripcion: data[1],
                        cantidad: 0,
                        precio_costo: 0,
                        precio_venta: (data[2] === undefined ? data[3] : data[2]),
                        user_created: "Administrador del Sistema",
                        user_updated: "Administrador del Sistema"
                    }
                    await axios.post(process.env.REACT_APP_SERVER_URL + '/inventarios/add',inventario)
                       .catch(err => {datosError.push(inventario); console.log(err)});                    
                }
            })
        }else{
            //this.state.rows.map( async (data,index) => {
            for (let index = 0; index < this.state.rows.length; index++) {
                const data = this.state.rows[index];
                if( data.length > 0 && index > 10000 && index <= 15000) {
                    const codigoInv = (data[6]+"").substring(2,7)
                    const inventario = this.state.inventarios.filter(el => el.codigo === codigoInv);
                    if(inventario.length > 0){
                        const fecha = this.excelDateToJSDate(data[0]);
                        let precio = (data[8] === 0 || isNaN(data[8]) ? data[9] : data[8]);
                        precio = (isNaN(precio) ? 0 : precio);

                        const cajaDetalles = {
                            caja: "63ece012273b64941aa2070d",
                            inventario: inventario[0]._id,
                            cantidad: data[5],
                            precio,
                            total: data[12],
                            estado: "Facturado",
                            user_created: "Administrador del Sistema",
                            user_updated: "Administrador del Sistema",
                            created_at: fecha,
                            updated_at: fecha
                        }  
                        datosImportar.push(cajaDetalles);
                    }else{                        
                        datosNotFound.push(data)
                    }
                }            
            }
        }

        axios.post(process.env.REACT_APP_SERVER_URL + '/cajas-detalles/importar',datosImportar)
        .catch(err => {console.log(err)})  

        console.log('datosImportar length '+datosImportar.length, datosImportar)
        console.log('datosNotFound', datosNotFound)
        console.log('datosError', datosError)
    }

    postDetalle = async (cajaDetalles, datosImportar, inventario) => {
        return await Promise.all(
            //console.log('cajaDetalles',cajaDetalles);
            axios.post(process.env.REACT_APP_SERVER_URL + '/cajas-detalles/importar',cajaDetalles)
            .then(() => {
                console.log('Agregado ',inventario[0].descripcion);
                datosImportar.push(cajaDetalles);
            })
            .catch(err => {console.log(err)})                       
        )
    }

    percentage = (partialValue, totalValue) => {
        return (100 * partialValue) / totalValue;
    } 
    
    handleFile = (event) => {
        let fileObj = event.target.files[0];
    
        //just pass the fileObj as parameter
        ExcelRenderer(fileObj, (err, resp) => {
            console.log(resp)
          if(err){
            console.log(err);            
          }
          else{
            this.setState({
              cols: resp.cols,
              rows: resp.rows
            }, () => {
                //Llamando para el analisis
                
                this.revisarExcel();
            });
          }
        });   
    }

    
    excelDateToJSDate = (date) => {
        let converted_date = new Date(Math.round((date - 25569) * 864e5));
        return converted_date;      
    }

    datalistCriticos(criticos){
        return criticos.map((dato, index) => {
            return (
                <div className="list-group-item" key={index}>
                    <div className="col-md-12"> - El dato {dato.data} se encontro {dato.count} veces, reemplacelos por el valor numerico 
                        <input type="text" className="form-control"/>
                    </div>
                </div>    
            )
        })
    }
    progressBar = () => {
        return <ProgressBar now={this.state.progress} label={`${this.state.progress}%`} />
    }
    
    
    datalist(){
        return this.state.arrayDataAnalisis.map((dato, index) => {

            return (
                <li className="list-group-item" key={index}>
                    <div className="col-md-3"><h4>Columna {dato.columna}</h4></div>
                    <div className="col-md-12">
                        Se encontro el {dato.numerico_porcentaje}% de tipos de datos numericos y {dato.alfanumerico_porcentaje}% de tipos de datos alfanumericos.<br/>
                        {(dato.datosCriticos.length > 0 ? 'Se encontraron estos datos criticos:' : '')}
                        {this.datalistCriticos(dato.datosCriticos)}
                    </div>
                </li>)
        })
    }
    
    onSubtmit = (e) => {
        e.preventDefault();
             
    }
    
    render(){          
        return(
            <div className="shadow p-3 m-5 bg-white rounded "> 
                <h3>Upload Files Facturacion</h3>
                <form onSubmit={this.onSubtmit}>
                    <div className="row">
                        <div className="form-group col-md-12">
                            <label>Archivo: </label>                                    
                            <input type="file" className="form-control" onChange={this.handleFile.bind(this)} style={{padding: '0px', height:'50%'}}/>
                        </div>                                
                    </div>                          
                    <div id="alert" className="alert alert-success alert-dismissible fade hide" role="alert">
                        <span id="text"></span>
                        <button type="button" className="close" onClick={this.handleCloseAlert}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>       
                    
                    {this.progressBar()}
                    {
                        this.state.arrayDataAnalisis.length === 0 ?
                            <div className="col-md-12 text-center m-3">Sin registros encontrados</div>
                        :
                            <ul id="list" className="list-group">{this.datalist()}</ul>                            
                    }
                </form>
            </div>
        )
    }
}
