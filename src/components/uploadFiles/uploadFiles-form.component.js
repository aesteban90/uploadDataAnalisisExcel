import React, {Component} from 'react';
import {ExcelRenderer} from 'react-excel-renderer';

export default class UploadFilesForm extends Component{    
    constructor(props){
        super(props);
        this.state = {  
            cols: [],
            rows: [],
            arrayDataAnalisis: [],
        };        
    }
    
    revisarExcel = () =>{
        let rows_lenght = this.state.rows.length - 1;
        let arrayDataAnalisis = [];

        this.state.rows.map((row,index) => {
            if( row.length > 0) {
                row.map((data,index_data) => {
                    let dataAnalisis = {columna: '', numerico:0, alfanumerico: 0, numerico_porcentaje:0, alfanumerico_porcentaje:0, datos:[], datosCriticos:[]};
                    
                    if( index > 0 ){                        
                        if(arrayDataAnalisis[index_data] != undefined){
                            dataAnalisis = arrayDataAnalisis[index_data];
                        }
                        
                        if(isNaN(data) || (data+"").trim() === ''){
                            dataAnalisis.alfanumerico++;
                            dataAnalisis.datos.push({data, type: 'alfanumerico'});
                        }else{
                            dataAnalisis.numerico++;
                            dataAnalisis.datos.push({data, type: 'numerico'});
                        }
                    }else{
                        dataAnalisis.columna = data;
                    }
                    arrayDataAnalisis[index_data] = dataAnalisis;
                });
            }
            
        })
        //Calculando los porcentajes
        arrayDataAnalisis.map( (dataAnalisis, index) =>{
            dataAnalisis.numerico_porcentaje = this.percentage(dataAnalisis.numerico, rows_lenght);
            dataAnalisis.alfanumerico_porcentaje = 100 - dataAnalisis.numerico_porcentaje;
            if(dataAnalisis.numerico_porcentaje > 80 && dataAnalisis.alfanumerico > 0 ){
                //Datos Criticos
                dataAnalisis.datos.map(dato => {
                    if(dato.type === 'alfanumerico'){
                        let critico = dataAnalisis.datosCriticos.filter(v => v.data == dato.data);
                        if(critico.length == 0){
                            dataAnalisis.datosCriticos.push({...dato, count: 1})
                        }else{
                            critico[0].count++;
                        }
                    }
                })
            }
        })
        console.log(arrayDataAnalisis)
        this.setState({arrayDataAnalisis})
        
    }

    percentage = (partialValue, totalValue) => {
        return (100 * partialValue) / totalValue;
    } 
    
    handleFile = (event) => {
        let fileObj = event.target.files[0];
    
        //just pass the fileObj as parameter
        ExcelRenderer(fileObj, (err, resp) => {
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
                <h3>Upload Files</h3>
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
