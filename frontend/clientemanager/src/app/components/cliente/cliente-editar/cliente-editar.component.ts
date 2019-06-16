import { ClienteService } from './../../../core/cliente.service';
import { Cliente } from './../../../core/model/cliente';
import { Email } from './../../../core/model/email';
import { BaseComponent } from './../../../core/base.component';
import { Telefone } from './../../../core/model/telefone';
import { MessageService } from 'primeng/api';
import { CepService } from './../../../core/cep.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { TipoTelefonePipe } from 'src/app/core/pipes/tipo-telefone.pipe';
import { TipoTelefone } from 'src/app/core/model/tipoTelefone';

@Component({
  selector: 'app-cliente-editar',
  templateUrl: './cliente-editar.component.html',
  styleUrls: ['./cliente-editar.component.scss'],
  providers: [MessageService]
})
export class ClienteEditarComponent extends BaseComponent implements OnInit {

  private tipoTelefonePipe: TipoTelefonePipe = new TipoTelefonePipe();

  public formularioCliente: FormGroup;
  public formularioTelefone: FormGroup;
  public formularioEmail: FormGroup;


  public telefones: Telefone[];
  public emails: Email[];

  public tiposTelefone = [
    {label: this.tipoTelefonePipe.transform(TipoTelefone.CELULAR), value: TipoTelefone.CELULAR},
    {label: this.tipoTelefonePipe.transform(TipoTelefone.COMERCIAL), value: TipoTelefone.COMERCIAL},
    {label: this.tipoTelefonePipe.transform(TipoTelefone.RESIDENCIAL), value: TipoTelefone.RESIDENCIAL}
  ];


  public maskCpf = [ /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/ ];
  public maskCep = [ /[1-9]/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/ ];

  public maskTelNormal = {mask: [ '(', /[1-9]/, /\d/, ')', ' ', /[1-9]/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/ ]};
  public maskTelCelular = {mask: [ '(', /[1-9]/, /\d/, ')', ' ', /[1-9]/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/ ]};
  public maskTel = this.maskTelNormal;
  public placeholderTelNormal: string = "(99) 9999-9999";
  public placeholderTelCelular: string = "(99) 99999-9999";
  public placeholderTel = this.placeholderTelNormal;

  constructor(
    private cepService: CepService,
    private messageService: MessageService,
    private clienteService: ClienteService) {
      super();
    }

  ngOnInit() {

    this.telefones = [];
    this.emails = [];

    this.formularioCliente = new FormGroup({
      id: new FormControl(''),
      nome: new FormControl('', Validators.required),
      cpf: new FormControl('', Validators.required),
      cep: new FormControl('', Validators.required),
      logradouro: new FormControl('', Validators.required),
      bairro: new FormControl('', Validators.required),
      cidade: new FormControl('', Validators.required),
      uf: new FormControl('', Validators.required),
      complemento: new FormControl(''),
    });

    this.formularioTelefone = new FormGroup({
      tipo: new FormControl('', Validators.required),
      numero: new FormControl('', Validators.required),
    });

    this.formularioEmail = new FormGroup({
      endereco: new FormControl('', [Validators.required, Validators.email])
    });
  }

  consultarCep() {

    var cep: string = this.formularioCliente.controls['cep'].value.replace(/\D/g, '');

    if (cep.length == 8) {

      this.cepService.consultarCep(cep).subscribe(res => {

        console.log(res);

        if (res.erro) {
          this.messageService.add({severity:'warn', summary: 'Erro ao buscar CEP', detail:'CEP não encontrado'});
        } else {
          this.formularioCliente.controls['logradouro'].setValue(res.logradouro);
          this.formularioCliente.controls['bairro'].setValue(res.bairro);
          this.formularioCliente.controls['cidade'].setValue(res.localidade);
          this.formularioCliente.controls['uf'].setValue(res.uf);
        }

      }, err => {
        this.messageService.add({severity:'warn', summary: 'Erro ao buscar CEP', detail:'CEP não encontrado'});
      });

    }
  }

  public onChangeTipoTelefone($event) {

    if ($event.value === TipoTelefone.CELULAR) {
      this.maskTel = this.maskTelCelular;
      this.placeholderTel = this.placeholderTelCelular;
    } else {
      this.maskTel = this.maskTelNormal;
      this.placeholderTel = this.placeholderTelNormal;
    }

  }

  adicionarTelefone() {
    if (this.formularioTelefone.valid) {
      var numero = this.toNumber(this.formularioTelefone.controls['numero'].value);
      var tipo = this.formularioTelefone.controls['tipo'].value;
      var tel: Telefone = new Telefone(tipo, numero);
      this.telefones.push(tel);
      this.limparCampos(this.formularioTelefone);
    } else {
      this.validateAllFormFields(this.formularioTelefone);
    }
  }

  removerTelefone(telefone:Telefone) {
    let index = this.telefones.indexOf( telefone );
    this.telefones.splice(index, 1);
  }

  adicionarEmail() {
    if (this.formularioEmail.valid) {
      this.emails.push(new Email(this.formularioEmail.controls['endereco'].value));
      this.limparCampos(this.formularioEmail);
    } else {
      this.validateAllFormFields(this.formularioEmail);
    }
  }

  removerEmail(email:Email) {
    let index = this.emails.indexOf( email );
    this.emails.splice(index, 1);
  }

  salvar() {
    if (this.formularioCliente.valid) {

      if (this.telefones.length == 0) {
        this.messageService.add({severity:'warn', summary: 'Atenção', detail:'Informe ao menos um Telefone'});
        return;
      }

      if (this.emails.length == 0) {
        this.messageService.add({severity:'warn', summary: 'Atenção', detail:'Informe ao menos um E-mail'});
        return;
      }

      var cliente: Cliente = new Cliente();
      cliente.telefones = this.telefones;
      cliente.emails = this.emails
      cliente.id = this.formularioCliente.controls['id'].value;
      cliente.nome = this.formularioCliente.controls['nome'].value;
      cliente.cpf = this.toNumber(this.formularioCliente.controls['cpf'].value);
      cliente.cep = this.toNumber(this.formularioCliente.controls['cep'].value);
      cliente.logradouro = this.formularioCliente.controls['logradouro'].value;
      cliente.bairro = this.formularioCliente.controls['bairro'].value;
      cliente.cidade = this.formularioCliente.controls['cidade'].value;
      cliente.uf = this.formularioCliente.controls['uf'].value;
      cliente.complemento = this.formularioCliente.controls['complemento'].value;

      this.clienteService.incluir(cliente).subscribe(res => {

        this.messageService.add({severity:'success', summary: 'Sucesso', detail:'Registro incluído com sucesso'});

        // if (res.erro) {
        //   this.messageService.add({severity:'warn', summary: 'Erro ao buscar CEP', detail:'CEP não encontrado'});
        // } else {
        //   this.formularioCliente.controls['logradouro'].setValue(res.logradouro);
        // }

      }, err => {
        this.messageService.add({severity:'error', summary: 'Erro', detail:'Erro ao incluir'});
      });

    } else {
      this.validateAllFormFields(this.formularioCliente);
    }
  }

}