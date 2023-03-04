import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadFilesForm from './components/uploadFiles/uploadFiles-form.component';
import ExcelFacturacionForm from './components/excelFacturacion/excelFacturacion-form.component';

function App() {
  return (
    <div id="container"> 
        <div className="body-wrapper container-fluid p-0">            
            <BrowserRouter>
              <Routes>
                <Route path='/upload' element={<UploadFilesForm />} />
                <Route path='/uploadFacturacion' element={<ExcelFacturacionForm />} />
              </Routes>
            </BrowserRouter>
        </div>
      </div>
  );
}

export default App;
